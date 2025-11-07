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
      console.log('🎙️ [startRecording] Iniciando processo...');
      
      // Stop any existing recording first
      if (recordingRef.current) {
        console.log('🧹 [startRecording] Limpando gravação anterior...');
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          console.log('⚠️ [startRecording] Erro ao limpar gravação anterior (ignorado):', e);
        }
        recordingRef.current = null;
      }

      // Reset audio mode first to ensure clean state
      console.log('🔄 [startRecording] Resetando modo de áudio...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      // Small delay to let audio system reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check permission status first (não mostra popup se já concedido)
      console.log('🔐 [startRecording] Verificando permissões...');
      const permissionResponse = await Audio.getPermissionsAsync();
      
      if (permissionResponse.status !== 'granted') {
        console.log('🎙️ [startRecording] Solicitando permissões...');
        const permission = await Audio.requestPermissionsAsync();
        
        if (permission.status !== 'granted') {
          console.error('❌ [startRecording] Permissão negada');
          return false;
        }
      } else {
        console.log('✅ [startRecording] Permissão já concedida');
      }

      // Set audio mode for recording
      console.log('🎚️ [startRecording] Configurando modo de gravação...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Another small delay for mobile
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🎙️ [startRecording] Criando gravação...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      console.log('✅ [startRecording] Gravação iniciada com sucesso!');
      return true;
    } catch (err) {
      console.error('❌ [startRecording] Erro ao iniciar gravação:', err);
      if (err instanceof Error) {
        console.error('❌ [startRecording] Detalhes do erro:', err.message);
      }
      // Force reset state
      recordingRef.current = null;
      setIsRecording(false);
      return false;
    }
  };

  const stopRecording = async () => {
    console.log('🛑 [stopRecording] Iniciando parada da gravação...');
    
    if (!recordingRef.current) {
      console.log('⚠️ [stopRecording] Nenhuma gravação ativa para parar');
      setIsRecording(false);
      return null;
    }

    try {
      console.log('🛑 [stopRecording] Obtendo URI...');
      const uri = recordingRef.current.getURI();
      console.log('📍 [stopRecording] URI obtida:', uri);
      
      console.log('🛑 [stopRecording] Parando e descarregando gravação...');
      await recordingRef.current.stopAndUnloadAsync();
      
      console.log('🔄 [stopRecording] Resetando modo de áudio...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });

      // Small delay to ensure audio system is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      recordingRef.current = null;
      setIsRecording(false);

      console.log('✅ [stopRecording] Gravação parada com sucesso!');
      return uri;
    } catch (err) {
      console.error('❌ [stopRecording] Erro ao parar gravação:', err);
      if (err instanceof Error) {
        console.error('❌ [stopRecording] Detalhes do erro:', err.message);
      }
      // Force reset state even on error
      recordingRef.current = null;
      setIsRecording(false);
      
      // Try to reset audio mode even on error
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      } catch (resetErr) {
        console.error('❌ [stopRecording] Erro ao resetar modo de áudio:', resetErr);
      }
      
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
