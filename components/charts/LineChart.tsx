import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface LineChartProps {
  data: { label: string; value: number }[];
  title?: string;
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, height = 200, color }) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const chartColor = color || colors.primary;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const chartWidth = Dimensions.get('window').width - 80;
  const pointSpacing = chartWidth / (data.length - 1 || 1);

  // Generate path for line
  const points = data.map((item, index) => {
    const x = index * pointSpacing;
    const y = height - 40 - ((item.value - minValue) / range) * (height - 60);
    return { x, y, value: item.value };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {title && (
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bold }]}>
          {title}
        </Text>
      )}
      <View style={[styles.chartContainer, { height }]}>
        {/* Grid lines */}
        <View style={styles.gridContainer}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                {
                  top: (i * (height - 60)) / 4 + 20,
                  borderColor: colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Line and points */}
        <View style={styles.lineContainer}>
          {points.map((point, index) => {
            const nextPoint = points[index + 1];
            return (
              <React.Fragment key={index}>
                {nextPoint && (
                  <View
                    style={[
                      styles.line,
                      {
                        left: point.x,
                        top: point.y,
                        width: Math.sqrt(
                          Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
                        ),
                        transform: [
                          {
                            rotate: `${Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)}rad`,
                          },
                        ],
                        backgroundColor: chartColor,
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.point,
                    {
                      left: point.x - 4,
                      top: point.y - 4,
                      backgroundColor: chartColor,
                      borderColor: colors.cardBackground,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.pointValue,
                    {
                      left: point.x - 12,
                      top: point.y - 20,
                      color: colors.textSecondary,
                      fontFamily: Fonts.semiBold,
                    },
                  ]}
                >
                  {point.value}
                </Text>
              </React.Fragment>
            );
          })}
        </View>

        {/* Labels */}
        <View style={styles.labelsContainer}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.label,
                {
                  left: index * pointSpacing - 20,
                  color: colors.textSecondary,
                  fontFamily: Fonts.medium,
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
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
  chartContainer: {
    position: 'relative',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  lineContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  pointValue: {
    position: 'absolute',
    fontSize: Fonts.sizes.xs,
    width: 24,
    textAlign: 'center',
  },
  labelsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: Fonts.sizes.xs,
    textAlign: 'center',
    width: 40,
  },
});

