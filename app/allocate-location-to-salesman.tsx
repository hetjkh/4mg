import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { allocateToSalesman, removeSalesmanAllocation, getSalesmanAllocations, LocationAllocation, getMyDealerAllocations } from '@/services/locationAllocationService';
import { getUser, User } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Fonts } from '@/constants/theme';
import { HeaderWithMenu } from '@/components/HeaderWithMenu';

export default function AllocateLocationToSalesmanScreen() {
  const { salesmanId, salesmanName } = useLocalSearchParams<{ salesmanId: string; salesmanName: string }>();
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [myAllocations, setMyAllocations] = useState<LocationAllocation[]>([]);
  const [salesmanAllocations, setSalesmanAllocations] = useState<LocationAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<LocationAllocation | null>(null);
  const [allocationScope, setAllocationScope] = useState<'full-district' | 'specific-talukas'>('full-district');
  const [selectedTalukas, setSelectedTalukas] = useState<string[]>([]);
  const [allocationSearchQuery, setAllocationSearchQuery] = useState('');
  const [talukaSearchQuery, setTalukaSearchQuery] = useState('');

  useEffect(() => {
    loadUser();
    loadData();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getUser();
      setCurrentUser(user);
      if (user?.role !== 'dealer' && user?.role !== 'dellear') {
        Alert.alert('Access Denied', 'Only dealers can allocate locations.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [myAllocs, salesmanAllocs] = await Promise.all([
        getMyDealerAllocations(),
        salesmanId ? getSalesmanAllocations(salesmanId) : Promise.resolve([])
      ]);
      setMyAllocations(myAllocs);
      setSalesmanAllocations(salesmanAllocs);
    } catch (err: any) {
      console.error('Error loading data:', err);
      Alert.alert('Error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedAllocation || !salesmanId) return;

    if (allocationScope === 'specific-talukas' && selectedTalukas.length === 0) {
      Alert.alert('Error', 'Please select at least one taluka');
      return;
    }

    setSubmitting(true);
    try {
      await allocateToSalesman({
        salesmanId,
        districtCode: selectedAllocation.districtCode,
        allocationScope,
        talukas: allocationScope === 'full-district' ? [] : selectedTalukas
      });
      Alert.alert('Success', 'Location allocated successfully');
      setShowAllocateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to allocate location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (allocationId: string, districtName: string) => {
    Alert.alert(
      'Remove Allocation',
      `Are you sure you want to remove allocation for ${districtName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSalesmanAllocation(allocationId);
              Alert.alert('Success', 'Allocation removed successfully');
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove allocation');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setSelectedAllocation(null);
    setAllocationScope('full-district');
    setSelectedTalukas([]);
    setAllocationSearchQuery('');
    setTalukaSearchQuery('');
  };

  const toggleTaluka = (taluka: string) => {
    if (selectedTalukas.includes(taluka)) {
      setSelectedTalukas(selectedTalukas.filter(t => t !== taluka));
    } else {
      setSelectedTalukas([...selectedTalukas, taluka]);
    }
  };

  const getAvailableTalukas = (allocation: LocationAllocation): string[] => {
    if (allocation.allocationScope === 'full-district') {
      return (allocation as any).allTalukas || [];
    }
    return allocation.talukas || [];
  };

  const filteredAllocations = myAllocations.filter(allocation =>
    allocation.districtName.toLowerCase().includes(allocationSearchQuery.toLowerCase())
  );

  const filteredTalukas = selectedAllocation
    ? getAvailableTalukas(selectedAllocation).filter(taluka =>
        taluka.toLowerCase().includes(talukaSearchQuery.toLowerCase())
      )
    : [];

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
      
      <HeaderWithMenu
        title="Allocate Location"
        showBack={true}
        rightButton={
          <TouchableOpacity
            onPress={() => setShowAllocateModal(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.addButtonText, { color: colors.textInverse }]}>+ Allocate</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.text }]}>Salesman: {salesmanName || 'Unknown'}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Current Allocations ({salesmanAllocations.length})
        </Text>

        {salesmanAllocations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No allocations yet. Click "+ Allocate" to add one.
            </Text>
          </View>
        ) : (
          salesmanAllocations.map((allocation) => (
            <View key={allocation.id} style={[styles.allocationCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.allocationHeader}>
                <Text style={[styles.districtName, { color: colors.text }]}>{allocation.districtName}</Text>
                <TouchableOpacity
                  onPress={() => handleRemove(allocation.id, allocation.districtName)}
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                >
                  <Text style={[styles.removeButtonText, { color: colors.textInverse }]}>Remove</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.allocationScope, { color: colors.textSecondary }]}>
                Scope: {allocation.allocationScope === 'full-district' ? 'Full District' : 'Specific Talukas'}
              </Text>
              {allocation.allocationScope === 'specific-talukas' && allocation.talukas.length > 0 && (
                <View style={styles.talukasContainer}>
                  <Text style={[styles.talukasLabel, { color: colors.textSecondary }]}>Talukas:</Text>
                  <View style={styles.talukasList}>
                    {allocation.talukas.map((taluka, idx) => (
                      <View key={idx} style={[styles.talukaBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.talukaText, { color: colors.primary }]}>{taluka}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Allocate Modal */}
      <Modal
        visible={showAllocateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllocateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Allocate Location</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAllocateModal(false);
                  resetForm();
                }}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              {/* My Allocations Selection */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>Select from Your Allocations</Text>
                {myAllocations.length === 0 ? (
                  <View style={[styles.emptyStateContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                      You don't have any allocations yet.{'\n'}Contact admin to get locations allocated.
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Search allocations..."
                      placeholderTextColor={colors.textTertiary}
                      value={allocationSearchQuery}
                      onChangeText={setAllocationSearchQuery}
                    />
                    <View style={[styles.allocationListContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <ScrollView style={styles.allocationList} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                        {filteredAllocations.length === 0 ? (
                          <View style={styles.emptySearchContainer}>
                            <Text style={[styles.emptySearchText, { color: colors.textTertiary }]}>
                              No allocations found matching "{allocationSearchQuery}"
                            </Text>
                          </View>
                        ) : (
                          filteredAllocations.map((allocation) => (
                            <TouchableOpacity
                              key={allocation.id}
                              onPress={() => {
                                setSelectedAllocation(allocation);
                                setAllocationScope('full-district');
                                setSelectedTalukas([]);
                                setAllocationSearchQuery('');
                              }}
                              style={[
                                styles.allocationItem,
                                { borderColor: colors.border },
                                selectedAllocation?.id === allocation.id && { 
                                  backgroundColor: colors.primary + '20', 
                                  borderColor: colors.primary,
                                  borderWidth: 2
                                }
                              ]}
                            >
                              <View style={styles.allocationItemContent}>
                                <Text style={[
                                  styles.allocationItemText, 
                                  { color: colors.text },
                                  selectedAllocation?.id === allocation.id && { color: colors.primary, fontFamily: Fonts.semiBold }
                                ]}>
                                  {allocation.districtName}
                                </Text>
                                <Text style={[styles.allocationItemSubtext, { color: colors.textSecondary }]}>
                                  {allocation.allocationScope === 'full-district' ? 'Full District' : `${allocation.talukas.length} Talukas`}
                                </Text>
                              </View>
                              {selectedAllocation?.id === allocation.id && (
                                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                              )}
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>

              {/* Allocation Scope */}
              {selectedAllocation && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text }]}>Allocation Scope</Text>
                  <View style={styles.scopeContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setAllocationScope('full-district');
                        setSelectedTalukas([]);
                      }}
                      style={[
                        styles.scopeButton,
                        { borderColor: colors.border },
                        allocationScope === 'full-district' && { 
                          backgroundColor: colors.primary + '20', 
                          borderColor: colors.primary,
                          borderWidth: 2
                        }
                      ]}
                    >
                      <Text style={[
                        styles.scopeButtonText, 
                        { color: colors.text },
                        allocationScope === 'full-district' && { color: colors.primary, fontFamily: Fonts.semiBold }
                      ]}>
                        Full District
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAllocationScope('specific-talukas')}
                      style={[
                        styles.scopeButton,
                        { borderColor: colors.border },
                        allocationScope === 'specific-talukas' && { 
                          backgroundColor: colors.primary + '20', 
                          borderColor: colors.primary,
                          borderWidth: 2
                        }
                      ]}
                    >
                      <Text style={[
                        styles.scopeButtonText, 
                        { color: colors.text },
                        allocationScope === 'specific-talukas' && { color: colors.primary, fontFamily: Fonts.semiBold }
                      ]}>
                        Specific Talukas
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Taluka Selection */}
              {allocationScope === 'specific-talukas' && selectedAllocation && (
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Select Talukas ({selectedTalukas.length} selected)
                  </Text>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Search taluka..."
                    placeholderTextColor={colors.textTertiary}
                    value={talukaSearchQuery}
                    onChangeText={setTalukaSearchQuery}
                  />
                  <View style={[styles.talukaListContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <ScrollView style={styles.talukaList} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                      {filteredTalukas.length === 0 ? (
                        <View style={styles.emptySearchContainer}>
                          <Text style={[styles.emptySearchText, { color: colors.textTertiary }]}>
                            No talukas found matching "{talukaSearchQuery}"
                          </Text>
                        </View>
                      ) : (
                        filteredTalukas.map((taluka) => (
                          <TouchableOpacity
                            key={taluka}
                            onPress={() => toggleTaluka(taluka)}
                            style={[
                              styles.talukaItem,
                              { borderColor: colors.border },
                              selectedTalukas.includes(taluka) && { 
                                backgroundColor: colors.primary + '20', 
                                borderColor: colors.primary,
                                borderWidth: 2
                              }
                            ]}
                          >
                            <Text style={[
                              styles.talukaItemText, 
                              { color: colors.text },
                              selectedTalukas.includes(taluka) && { color: colors.primary, fontFamily: Fonts.semiBold }
                            ]}>
                              {taluka}
                            </Text>
                            {selectedTalukas.includes(taluka) && (
                              <View style={[styles.checkmarkCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.checkmarkText}>✓</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setShowAllocateModal(false);
                  resetForm();
                }}
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                disabled={submitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAllocate}
                style={[
                  styles.modalButton, 
                  styles.submitButton, 
                  { 
                    backgroundColor: colors.primary, 
                    opacity: submitting || !selectedAllocation ? 0.6 : 1 
                  }
                ]}
                disabled={submitting || !selectedAllocation}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>Allocate</Text>
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
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
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
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  districtName: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
  },
  allocationScope: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.light,
    marginBottom: 8,
  },
  talukasContainer: {
    marginTop: 8,
  },
  talukasLabel: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  talukasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  talukaBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  talukaText: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    height: '85%',
    maxHeight: 700,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.light,
    marginBottom: 12,
  },
  emptySearchContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.light,
    textAlign: 'center',
  },
  emptyStateContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  allocationListContainer: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  allocationList: {
    maxHeight: 200,
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  allocationItemContent: {
    flex: 1,
  },
  allocationItemText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.medium,
    marginBottom: 4,
  },
  allocationItemSubtext: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.light,
  },
  scopeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  scopeButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.medium,
  },
  talukaListContainer: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 250,
    overflow: 'hidden',
  },
  talukaList: {
    maxHeight: 250,
  },
  talukaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  talukaItemText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.light,
    flex: 1,
  },
  checkmark: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginLeft: 8,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  modalButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
  },
});

