import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, height = 200 }) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
          {title}
        </Text>
      )}
      <View style={[styles.chartContainer, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 60);
          const barColor = item.color || colors.primary;
          
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    },
                  ]}
                />
                <Text style={[styles.barValue, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                  {item.value}
                </Text>
              </View>
              <Text style={[styles.barLabel, { color: colors.textSecondary, fontFamily: Fonts.medium }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 40,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: Fonts.sizes.sm,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: Fonts.sizes.xs,
    textAlign: 'center',
    marginTop: 4,
  },
});

