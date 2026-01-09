import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  size?: number;
  centerValue?: string | number;
  centerLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  title, 
  size = 200,
  centerValue,
  centerLabel 
}) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        {title && (
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
            {title}
          </Text>
        )}
        <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
          No data available
        </Text>
      </View>
    );
  }

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const segmentColor = item.color || 
      (index === 0 ? colors.roleStalkist :
       index === 1 ? colors.roleDellear :
       index === 2 ? colors.roleSalesman : colors.primary);

    return {
      ...item,
      percentage,
      color: segmentColor,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
          {title}
        </Text>
      )}
      <View style={styles.chartWrapper}>
        {/* Center value display */}
        {(centerValue !== undefined || centerLabel) && (
          <View style={[styles.centerDisplay, { backgroundColor: colors.backgroundSecondary }]}>
            {centerValue !== undefined && (
              <Text style={[styles.centerValue, { color: colors.text, fontFamily: Fonts.bold }]}>
                {centerValue}
              </Text>
            )}
            {centerLabel && (
              <Text style={[styles.centerLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]}>
                {centerLabel}
              </Text>
            )}
          </View>
        )}
        
        {/* Donut representation using bars */}
        <View style={styles.barChart}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.barRow}>
              <View style={[styles.barContainer, { width: `${segment.percentage}%`, backgroundColor: segment.color }]} />
              <View style={styles.barInfo}>
                <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
                <Text style={[styles.legendLabel, { color: colors.text, fontFamily: Fonts.medium }]}>
                  {segment.label}
                </Text>
                <Text style={[styles.legendValue, { color: colors.textSecondary, fontFamily: Fonts.semiBold }]}>
                  {segment.value} ({segment.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
    padding: 20,
  },
  chartWrapper: {
    width: '100%',
  },
  centerDisplay: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  centerValue: {
    fontSize: Fonts.sizes['2xl'],
  },
  centerLabel: {
    fontSize: Fonts.sizes.sm,
    marginTop: 4,
  },
  barChart: {
    gap: 12,
  },
  barRow: {
    gap: 8,
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
  },
  barInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: Fonts.sizes.sm,
  },
  legendValue: {
    fontSize: Fonts.sizes.sm,
  },
});

