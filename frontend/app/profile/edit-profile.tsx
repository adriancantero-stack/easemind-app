import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

interface UserProfile {
  display_name: string;
  profile_photo: string | null;
  goals: string[];
  notification_enabled: boolean;
  preferred_time: string;
  age_range: string | null;
  gender: string | null;
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  
  // Estados do formulário
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [preferredTime, setPreferredTime] = useState('morning');
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  const goals = [
    { id: 'reduce_anxiety', label: t('profile.goalReduceAnxiety') },
    { id: 'improve_sleep', label: t('profile.goalImproveSleep') },
    { id: 'increase_focus', label: t('profile.goalIncreaseFocus') },
    { id: 'regulate_mood', label: t('profile.goalRegulateMood') },
  ];

  const timeOptions = [
    { id: 'morning', label: t('profile.morning') },
    { id: 'afternoon', label: t('profile.afternoon') },
    { id: 'evening', label: t('profile.evening') },
    { id: 'night', label: t('profile.night') },
  ];

  const ageRangeOptions = [
    { id: null, label: t('profile.notInformed') },
    { id: '18-24', label: t('profile.age18_24') },
    { id: '25-34', label: t('profile.age25_34') },
    { id: '35-44', label: t('profile.age35_44') },
    { id: '45-54', label: t('profile.age45_54') },
    { id: '55+', label: t('profile.age55plus') },
  ];

  const genderOptions = [
    { id: null, label: t('profile.notInformed') },
    { id: 'male', label: t('profile.genderMale') },
    { id: 'female', label: t('profile.genderFemale') },
    { id: 'non_binary', label: t('profile.genderNonBinary') },
    { id: 'other', label: t('profile.genderOther') },
  ];

  // Buscar perfil ao carregar
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!user?.uid) return;

      const backendUrl = Constants.expoConfig?.extra?.EXPO_PACKAGER_HOSTNAME;
      const response = await fetch(`${backendUrl}/api/user/profile/${user.uid}`);
      
      if (response.ok) {
        const data = await response.json();
        const profile = data.user;
        
        setDisplayName(profile.display_name || '');
        setProfilePhoto(profile.profile_photo);
        setSelectedGoals(profile.goals || []);
        setNotificationEnabled(profile.notification_enabled ?? true);
        setPreferredTime(profile.preferred_time || 'morning');
        setAgeRange(profile.age_range);
        setGender(profile.gender);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const pickImage = async () => {
    try {
      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('profile.error'),
          'Permissão para acessar a galeria foi negada'
        );
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setProfilePhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        throw new Error('Usuário não autenticado');
      }

      const backendUrl = Constants.expoConfig?.extra?.EXPO_PACKAGER_HOSTNAME;
      const response = await fetch(`${backendUrl}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: user.uid,
          display_name: displayName || null,
          profile_photo: profilePhoto,
          goals: selectedGoals,
          notification_enabled: notificationEnabled,
          preferred_time: preferredTime,
          age_range: ageRange,
          gender: gender,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar perfil');
      }

      const data = await response.json();

      if (Platform.OS === 'web') {
        window.alert(t('profile.saveSuccess'));
      } else {
        Alert.alert(t('profile.myProfile'), t('profile.saveSuccess'));
      }
      
      router.back();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      
      if (Platform.OS === 'web') {
        window.alert(t('profile.saveError'));
      } else {
        Alert.alert(t('profile.error'), t('profile.saveError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.accent1} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {t('profile.editProfile')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Foto de Perfil */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.profilePhoto')}
          </Text>
          <View style={styles.photoContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: currentTheme.accent1 + '20' }]}>
                <Ionicons name="person" size={64} color={currentTheme.accent1} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: currentTheme.accent1 }]}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
              <Text style={styles.changePhotoText}>
                {profilePhoto ? t('profile.changePhoto') : t('profile.addPhoto')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nome */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.displayName')}
          </Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: currentTheme.bg, 
              color: currentTheme.text,
              borderColor: currentTheme.accent1 + '30'
            }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('profile.displayNamePlaceholder')}
            placeholderTextColor={currentTheme.textMuted}
          />
        </View>

        {/* Objetivos */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            🎯 {t('profile.myGoals')}
          </Text>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.checkboxItem,
                selectedGoals.includes(goal.id) && {
                  backgroundColor: currentTheme.accent1 + '20',
                },
              ]}
              onPress={() => toggleGoal(goal.id)}
            >
              <Ionicons
                name={selectedGoals.includes(goal.id) ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedGoals.includes(goal.id) ? currentTheme.accent1 : currentTheme.textMuted}
              />
              <Text style={[styles.checkboxLabel, { color: currentTheme.text }]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferências */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            🔔 {t('profile.preferences')}
          </Text>
          
          <View style={styles.preferenceRow}>
            <Text style={[styles.preferenceLabel, { color: currentTheme.text }]}>
              {t('profile.notificationsEnabled')}
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                notificationEnabled && { backgroundColor: currentTheme.accent1 }
              ]}
              onPress={() => setNotificationEnabled(!notificationEnabled)}
            >
              <View style={[
                styles.toggleCircle,
                notificationEnabled && styles.toggleCircleActive
              ]} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subLabel, { color: currentTheme.textSecondary }]}>
            {t('profile.preferredTime')}
          </Text>
          <View style={styles.optionsGrid}>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionChip,
                  { borderColor: currentTheme.accent1 + '30' },
                  preferredTime === option.id && {
                    backgroundColor: currentTheme.accent1 + '20',
                    borderColor: currentTheme.accent1,
                  },
                ]}
                onPress={() => setPreferredTime(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: preferredTime === option.id ? currentTheme.accent1 : currentTheme.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informações Opcionais */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            📊 {t('profile.optionalInfo')}
          </Text>

          <Text style={[styles.subLabel, { color: currentTheme.textSecondary }]}>
            {t('profile.ageRange')}
          </Text>
          <View style={styles.optionsGrid}>
            {ageRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.id || 'none'}
                style={[
                  styles.optionChip,
                  { borderColor: currentTheme.accent1 + '30' },
                  ageRange === option.id && {
                    backgroundColor: currentTheme.accent1 + '20',
                    borderColor: currentTheme.accent1,
                  },
                ]}
                onPress={() => setAgeRange(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: ageRange === option.id ? currentTheme.accent1 : currentTheme.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { color: currentTheme.textSecondary, marginTop: 16 }]}>
            {t('profile.gender')}
          </Text>
          <View style={styles.optionsGrid}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.id || 'none'}
                style={[
                  styles.optionChip,
                  { borderColor: currentTheme.accent1 + '30' },
                  gender === option.id && {
                    backgroundColor: currentTheme.accent1 + '20',
                    borderColor: currentTheme.accent1,
                  },
                ]}
                onPress={() => setGender(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: gender === option.id ? currentTheme.accent1 : currentTheme.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: currentTheme.accent1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.saveButtonText}>{t('profile.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    padding: theme.spacing.md,
    borderRadius: theme.radius,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  photoContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 16,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CCC',
    justifyContent: 'center',
    padding: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
