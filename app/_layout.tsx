import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    setupAudio();
  }, []);

  const setupAudio = async () => {
    const permission = await Audio.requestPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Microphone Required',
        'MediaCom needs microphone access to work'
      );
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,

      // iOS
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,

      // Android
      shouldDuckAndroid: false,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: true,
    });

  };

  return <Stack screenOptions={{ headerShown: false }} />;
}
