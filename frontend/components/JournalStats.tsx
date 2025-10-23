import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { theme } from '../utils/theme';

const screenWidth = Dimensions.get('window').width;

interface JournalStatsProps {
  entries: any[];
  isDarkMode: boolean;
  t: (key: string) => string;
}

export const JournalStats: React.FC<JournalStatsProps> = ({ entries, isDarkMode, t }) => {
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const getStats = (days: number) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= now;
    });

    if (filteredEntries.length === 0) {
      return {
        average: 0,
        trend: 'stable',
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        chartData: [],
        labels: []
      };
    }

    const sum = filteredEntries.reduce((acc, entry) => acc + entry.mood, 0);
    const average = sum / filteredEntries.length;

    const firstHalf = filteredEntries.slice(0, Math.floor(filteredEntries.length / 2));
    const secondHalf = filteredEntries.slice(Math.floor(filteredEntries.length / 2));
    const firstAvg = firstHalf.reduce((acc, e) => acc + e.mood, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((acc, e) => acc + e.mood, 0) / (secondHalf.length || 1);
    const trend = secondAvg > firstAvg + 0.3 ? 'improving' : secondAvg < firstAvg - 0.3 ? 'declining' : 'stable';

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredEntries.forEach(entry => {
      distribution[entry.mood as 1|2|3|4|5]++;
    });

    const recentEntries = filteredEntries.slice(-7);
    const chartData = recentEntries.map(entry => entry.mood);
    const labels = recentEntries.map((entry, i) => `D${i+1}`);

    return { average, trend, total: filteredEntries.length, distribution, chartData, labels };
  };

  const stats = getStats(selectedPeriod);
  const moods = [
    { value: 1, emoji: '😢', label: t('journal.veryBad') },
    { value: 2, emoji: '😕', label: t('journal.bad') },
    { value: 3, emoji: '😐', label: t('journal.neutral') },
    { value: 4, emoji: '🙂', label: t('journal.good') },
    { value: 5, emoji: '😊', label: t('journal.veryGood') },
  ];

  const getTrendText = () => {
    if (stats.trend === 'improving') return '↗️ ' + t('journal.improving');
    if (stats.trend === 'declining') return '↘️ ' + t('journal.declining');
    return '→ ' + t('journal.stable');
  };

  const getTrendColor = () => {
    if (stats.trend === 'improving') return '#4CAF50';
    if (stats.trend === 'declining') return '#FF6B6B';
    return currentTheme.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {[7, 30, 90].map(days => (
          <TouchableOpacity
            key={days}
            style={[
              styles.periodButton,
              { 
                backgroundColor: selectedPeriod === days ? currentTheme.accent1 : currentTheme.card,
                borderColor: currentTheme.accent1 
              }
            ]}
            onPress={() => setSelectedPeriod(days)}
          >
            <Text style={[
              styles.periodButtonText,
              { color: selectedPeriod === days ? '#FFF' : currentTheme.text }
            ]}>
              {days === 7 ? '7d' : days === 30 ? '30d' : '3m'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats.total === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            {t('journal.noDataForPeriod')}
          </Text>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryCards}>
            <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.cardLabel, { color: currentTheme.textSecondary }]}>
                {t('journal.averageMood')}
              </Text>
              <Text style={[styles.cardValue, { color: currentTheme.text }]}>
                {stats.average.toFixed(1)}/5
              </Text>
              <Text style={styles.cardEmoji}>
                {moods.find(m => Math.round(stats.average) === m.value)?.emoji || '😐'}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.cardLabel, { color: currentTheme.textSecondary }]}>
                {t('journal.trend')}
              </Text>
              <Text style={[styles.cardValue, { color: getTrendColor() }]}>
                {getTrendText()}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.cardLabel, { color: currentTheme.textSecondary }]}>
                {t('journal.totalEntries')}
              </Text>
              <Text style={[styles.cardValue, { color: currentTheme.text }]}>
                {stats.total}
              </Text>
            </View>
          </View>

          {/* Line Chart */}
          {stats.chartData.length > 1 && (
            <View style={[styles.chartContainer, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.chartTitle, { color: currentTheme.text }]}>
                {t('journal.moodEvolution')}
              </Text>
              <LineChart
                data={{
                  labels: stats.labels,
                  datasets: [{ data: stats.chartData }]
                }}
                width={screenWidth - 64}
                height={200}
                chartConfig={{
                  backgroundColor: currentTheme.card,
                  backgroundGradientFrom: currentTheme.card,
                  backgroundGradientTo: currentTheme.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(138, 101, 216, ${opacity})`,
                  labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: currentTheme.accent1
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {/* Bar Chart - Distribution */}
          <View style={[styles.chartContainer, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.chartTitle, { color: currentTheme.text }]}>
              {t('journal.moodDistribution')}
            </Text>
            <BarChart
              data={{
                labels: ['😢', '😕', '😐', '🙂', '😊'],
                datasets: [{ 
                  data: [
                    stats.distribution[1],
                    stats.distribution[2],
                    stats.distribution[3],
                    stats.distribution[4],
                    stats.distribution[5]
                  ]
                }]
              }}
              width={screenWidth - 64}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: currentTheme.card,
                backgroundGradientFrom: currentTheme.card,
                backgroundGradientTo: currentTheme.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(138, 101, 216, ${opacity})`,
                labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 }
              }}
              style={styles.chart}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardEmoji: {
    fontSize: 24,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
