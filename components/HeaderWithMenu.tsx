import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDrawer } from './GlobalDrawer';

interface HeaderWithMenuProps {
  title: string;
  showBack?: boolean;
  rightButton?: React.ReactNode;
}

export function HeaderWithMenu({ title, showBack = false, rightButton }: HeaderWithMenuProps) {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { openDrawer } = useDrawer();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack} style={styles.menuButton}>
          <IconSymbol name="chevron.right" size={24} color={colors.primaryLight} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
        >
          <IconSymbol name="line.3.horizontal" size={28} color={colors.text} />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.bold }]}>{title}</Text>
      {rightButton || <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    flex: 1,
    textAlign: 'center',
  },
});

