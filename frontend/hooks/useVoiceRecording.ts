import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      // Stop any existing recording first
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('Cleaning up previous recording');
        }
        recordingRef.current = null;
      }

      // Check permission status first (não mostra popup se já concedido)
      const permissionResponse = await Audio.getPermissionsAsync();
      
      if (permissionResponse.status !== 'granted') {
        console.log('🎙️ Requesting permissions...');
        const permission = await Audio.requestPermissionsAsync();
        
        if (permission.status !== 'granted') {
          console.error('❌ Permission denied');
          return false;
        }
      } else {
        console.log('✅ Permission already granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎙️ Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('✅ Recording started');
      return true;
    } catch (err) {
      console.error('❌ Failed to start recording', err);
      return false;
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      return null;
    }

    try {
      console.log('🛑 Stopping recording...');
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      console.log('✅ Recording stopped:', uri);
      return uri;
    } catch (err) {
      console.error('❌ Failed to stop recording', err);
      return null;
    }
  };

  const transcribeAudio = async (audioUri: string, backendUrl: string): Promise<string | null> => {
    if (!audioUri) return null;

    setIsTranscribing(true);

    try {
      console.log('📝 Transcribing audio from:', audioUri);
      console.log('📡 Backend URL:', backendUrl);

      // Create form data
      const formData = new FormData();
      
      // For web, we need to handle differently
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected, fetching blob...');
        const response = await fetch(audioUri);
        const blob = await response.blob();
        console.log('✅ Blob created:', blob.size, 'bytes');
        formData.append('file', blob, 'audio.m4a');
      } else {
        // For mobile - use direct file URI
        console.log('📱 Mobile platform detected, using file URI');
        formData.append('file', {
          uri: audioUri,
          type: 'audio/m4a',
          name: 'audio.m4a',
        } as any);
      }

      // Upload to backend
      console.log('📤 Uploading to:', `${backendUrl}/api/transcribe`);
      const response = await fetch(`${backendUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Transcribed:', data.text);
      
      return data.text;
    } catch (error) {
      console.error('❌ Transcription error:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribeAudio,
  };
};
