import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { format } from 'date-fns';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  date: string;
}

export default function JournalScreen() {
  const { t, i18n } = useTranslation();
  const language = useStore((state) => state.language);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Sincronizar idioma do i18n com o idioma do store
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
  const getUserId = useStore((state) => state.getUserId);
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState(3);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'entries' | 'stats'>('entries');

  const backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    'http://localhost:8001';

  const moods = [
    { value: 1, emoji: '😢' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😊' },
  ];

  // Get stats for selected period
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
        chartData: []
      };
    }

    // Calculate average mood
    const sum = filteredEntries.reduce((acc, entry) => acc + entry.mood, 0);
    const average = sum / filteredEntries.length;

    // Calculate trend
    const firstHalf = filteredEntries.slice(0, Math.floor(filteredEntries.length / 2));
    const secondHalf = filteredEntries.slice(Math.floor(filteredEntries.length / 2));
    const firstAvg = firstHalf.reduce((acc, e) => acc + e.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, e) => acc + e.mood, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 0.3 ? 'improving' : secondAvg < firstAvg - 0.3 ? 'declining' : 'stable';

    // Distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredEntries.forEach(entry => {
      distribution[entry.mood as 1|2|3|4|5]++;
    });

    // Chart data (last 7 points)
    const chartData = filteredEntries.slice(-7).map(entry => entry.mood);

    return { average, trend, total: filteredEntries.length, distribution, chartData };
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const userId = await getUserId();
      const response = await fetch(`${backendUrl}/api/journal/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        console.log('📓 Loaded', data.entries.length, 'journal entries');
      }
    } catch (error) {
      console.error('Failed to load journal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createEntry = async () => {
    if (!newContent.trim()) {
      if (Platform.OS === 'web') {
        window.alert(`${t('journal.error')}\n\n${t('journal.fillContent')}`);
      } else {
        Alert.alert(t('journal.error'), t('journal.fillContent'));
      }
      return;
    }

    setIsSaving(true);
    try {
      const userId = await getUserId();
      console.log('📓 [1/5] User ID obtained:', userId);
      
      // Gerar título automático baseado na data
      const autoTitle = format(selectedDate, "d MMM yyyy");
      console.log('📓 [2/5] Title generated:', autoTitle);
      
      const payload = {
        user_id: userId,
        title: autoTitle,
        content: newContent,
        mood: newMood,
        tags: [],
        date: selectedDate.toISOString(),
      };
      
      console.log('📓 [3/5] Payload created:', JSON.stringify(payload, null, 2));
      console.log('📓 [4/5] Backend URL:', `${backendUrl}/api/journal`);
      console.log('📓 [4.1/5] Full backend URL from env:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📓 [5/5] Response received - status:', response.status, 'ok:', response.ok);
      console.log('📓 Response URL:', response.url);
      console.log('📓 Response headers:', JSON.stringify([...response.headers.entries()]));
      
      // Verificar se a resposta é JSON válida
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('✅ Response data (JSON):', JSON.stringify(responseData, null, 2));
      } else {
        const textResponse = await response.text();
        console.log('⚠️ Response data (TEXT):', textResponse);
        responseData = { detail: textResponse };
      }

      if (response.ok) {
        console.log('✅ Journal entry created successfully');
        console.log('📓 Closing modal and reloading entries...');
        
        // Usar window.alert na web e Alert nativo em mobile
        if (Platform.OS === 'web') {
          window.alert(`${t('journal.success')}\n\n${t('journal.entrySaved')}`);
        } else {
          Alert.alert(t('journal.success'), t('journal.entrySaved'));
        }
        
        setShowNewEntryModal(false);
        setNewContent('');
        setNewMood(3);
        setSelectedDate(new Date());
        
        console.log('📓 Calling loadEntries()...');
        await loadEntries();
        console.log('📓 Entry list reloaded!');
      } else {
        console.error('❌ Failed to create journal entry. Status:', response.status);
        console.error('❌ Response data:', responseData);
        
        const errorMsg = `${t('journal.saveFailed')}\n\nStatus: ${response.status}\n${responseData.detail || JSON.stringify(responseData)}`;
        if (Platform.OS === 'web') {
          window.alert(`${t('journal.error')}\n\n${errorMsg}`);
        } else {
          Alert.alert(t('journal.error'), errorMsg);
        }
      }
    } catch (error: any) {
      console.error('❌ Exception creating entry:', error);
      console.error('❌ Error stack:', error.stack);
      
      const errorMsg = `${t('journal.saveFailed')}\n\n${error.message || 'Unknown error'}`;
      if (Platform.OS === 'web') {
        window.alert(`${t('journal.error')}\n\n${errorMsg}`);
      } else {
        Alert.alert(t('journal.error'), errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😐';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.accent1} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {t('journal.title')}
        </Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: currentTheme.accent1 }]}
          onPress={() => setShowNewEntryModal(true)}
        >
          <Text style={styles.newButtonText}>{t('journal.newButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'entries' && [styles.activeTab, { borderBottomColor: currentTheme.accent1 }]
          ]}
          onPress={() => setActiveTab('entries')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'entries' ? currentTheme.accent1 : currentTheme.textSecondary }
          ]}>
            {t('journal.entries')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stats' && [styles.activeTab, { borderBottomColor: currentTheme.accent1 }]
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'stats' ? currentTheme.accent1 : currentTheme.textSecondary }
          ]}>
            {t('journal.statistics')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {activeTab === 'entries' ? (
          // Entries Tab Content
          entries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.emptyText, { color: currentTheme.text }]}>
                {t('journal.noEntries')}
              </Text>
              <Text style={[styles.emptySubtext, { color: currentTheme.text, opacity: 0.7 }]}>
                {t('journal.noEntriesSubtext')}
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: currentTheme.card }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryTitle, { color: currentTheme.text }]}>
                    {entry.title}
                  </Text>
                  <Text style={styles.moodEmoji}>
                    {getMoodEmoji(entry.mood)}
                  </Text>
                </View>
                <Text style={[styles.entryContent, { color: currentTheme.textSecondary }]}>
                  {entry.content}
                </Text>
                <Text style={[styles.entryDate, { color: currentTheme.textSecondary }]}>
                  {format(new Date(entry.date), "d MMM yyyy, HH:mm")}
                </Text>
                {entry.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {entry.tags.map((tag, idx) => (
                      <View key={idx} style={[styles.tag, { backgroundColor: currentTheme.accent1 + '20' }]}>
                        <Text style={[styles.tagText, { color: currentTheme.accent1 }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )
        ) : (
          // Statistics Tab Content
          <View>
            {entries.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: currentTheme.card }]}>
                <Text style={[styles.emptyText, { color: currentTheme.text }]}>
                  {t('journal.noDataForStats')}
                </Text>
                <Text style={[styles.emptySubtext, { color: currentTheme.text, opacity: 0.7 }]}>
                  {t('journal.addEntriesForStats')}
                </Text>
              </View>
            ) : (
              <>
                {/* Weekly Stats */}
                <View style={[styles.statsCard, { backgroundColor: currentTheme.card }]}>
                  <Text style={[styles.statsTitle, { color: currentTheme.text }]}>
                    {t('journal.weeklyStats')}
                  </Text>
                  {(() => {
                    const weekStats = getStats(7);
                    return (
                      <View>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                            {t('journal.averageMood')}
                          </Text>
                          <Text style={[styles.statValue, { color: currentTheme.text }]}>
                            {weekStats.average.toFixed(1)} {getMoodEmoji(Math.round(weekStats.average))}
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                            {t('journal.totalEntries')}
                          </Text>
                          <Text style={[styles.statValue, { color: currentTheme.text }]}>
                            {weekStats.total}
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                            {t('journal.trend')}
                          </Text>
                          <Text style={[styles.statValue, { color: currentTheme.text }]}>
                            {weekStats.trend === 'improving' ? '📈' : weekStats.trend === 'declining' ? '📉' : '➡️'} 
                            {t(`journal.${weekStats.trend}`)}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Monthly Stats */}
                <View style={[styles.statsCard, { backgroundColor: currentTheme.card }]}>
                  <Text style={[styles.statsTitle, { color: currentTheme.text }]}>
                    {t('journal.monthlyStats')}
                  </Text>
                  {(() => {
                    const monthStats = getStats(30);
                    return (
                      <View>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                            {t('journal.averageMood')}
                          </Text>
                          <Text style={[styles.statValue, { color: currentTheme.text }]}>
                            {monthStats.average.toFixed(1)} {getMoodEmoji(Math.round(monthStats.average))}
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>
                            {t('journal.totalEntries')}
                          </Text>
                          <Text style={[styles.statValue, { color: currentTheme.text }]}>
                            {monthStats.total}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Mood Distribution */}
                <View style={[styles.statsCard, { backgroundColor: currentTheme.card }]}>
                  <Text style={[styles.statsTitle, { color: currentTheme.text }]}>
                    {t('journal.moodDistribution')}
                  </Text>
                  {(() => {
                    const monthStats = getStats(30);
                    return (
                      <View style={styles.moodDistribution}>
                        {Object.entries(monthStats.distribution).map(([mood, count]) => (
                          <View key={mood} style={styles.moodDistributionItem}>
                            <Text style={styles.moodDistributionEmoji}>
                              {getMoodEmoji(parseInt(mood))}
                            </Text>
                            <Text style={[styles.moodDistributionCount, { color: currentTheme.text }]}>
                              {count}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showNewEntryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewEntryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              {t('journal.newEntryTitle')}
            </Text>

            {/* Data */}
            <Text style={[styles.sectionLabel, { color: currentTheme.text }]}>
              📅 {t('journal.dateLabel')}
            </Text>
            <TouchableOpacity 
              style={[styles.dateButton, { backgroundColor: currentTheme.bg }]}
              onPress={() => {
                // Aqui poderia abrir um DatePicker, mas por simplicidade vamos usar a data atual
              }}
            >
              <Text style={[styles.dateText, { color: currentTheme.text }]}>
                {format(selectedDate, "d MMM yyyy")}
              </Text>
            </TouchableOpacity>

            {/* Mood Selector */}
            <Text style={[styles.sectionLabel, { color: currentTheme.text }]}>
              😊 {t('journal.moodLabel')}
            </Text>
            <View style={styles.moodPicker}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodButton,
                    { backgroundColor: currentTheme.bg },
                    newMood === mood.value && { backgroundColor: currentTheme.accent1, transform: [{ scale: 1.1 }] },
                  ]}
                  onPress={() => setNewMood(mood.value)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content */}
            <TextInput
              style={[styles.textArea, { backgroundColor: currentTheme.bg, color: currentTheme.text }]}
              placeholder={t('journal.howFeeling')}
              placeholderTextColor={currentTheme.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.textSecondary + '30' }]}
                onPress={() => setShowNewEntryModal(false)}
                disabled={isSaving}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.text }]}>
                  {t('journal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.accent1 }]}
                onPress={createEntry}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>
                    {t('journal.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  entryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 12,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  dateButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  moodPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  moodDistribution: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  moodDistributionItem: {
    alignItems: 'center',
  },
  moodDistributionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodDistributionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
