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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  date: string;
}

export default function JournalScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const getUserId = useStore((state) => state.getUserId);
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL;

  const moods = [
    { value: 1, emoji: '😢' },
    { value: 2, emoji: '😕' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '🙂' },
    { value: 5, emoji: '😊' },
  ];

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
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert(t('journal.error'), t('journal.fillFields'));
      return;
    }

    setIsSaving(true);
    try {
      const userId = await getUserId();
      const response = await fetch(`${backendUrl}/api/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          title: newTitle,
          content: newContent,
          mood: newMood,
          tags: [],
        }),
      });

      if (response.ok) {
        console.log('📓 Journal entry created');
        setShowNewEntryModal(false);
        setNewTitle('');
        setNewContent('');
        setNewMood(3);
        loadEntries();
      }
    } catch (error) {
      console.error('Failed to create entry:', error);
      Alert.alert(t('journal.error'), t('journal.saveFailed'));
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {entries.length === 0 ? (
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

            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.bg, color: currentTheme.text }]}
              placeholder={t('journal.titlePlaceholder')}
              placeholderTextColor={currentTheme.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.textArea, { backgroundColor: currentTheme.bg, color: currentTheme.text }]}
              placeholder={t('journal.contentPlaceholder')}
              placeholderTextColor={currentTheme.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={[styles.moodLabel, { color: currentTheme.text }]}>
              {t('journal.moodLabel')}
            </Text>
            <View style={styles.moodPicker}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodButton,
                    { backgroundColor: currentTheme.bg },
                    newMood === mood.value && { backgroundColor: currentTheme.accent1 },
                  ]}
                  onPress={() => setNewMood(mood.value)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
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
});
