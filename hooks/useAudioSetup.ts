import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export async function setupAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      
      // iOS
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      
      // Android
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false, // Force speaker for intercom feel
      
      staysActiveInBackground: true, // Crucial for media teams
    });
    console.log("✅ Audio Mode Initialized for Intercom");
  } catch (error) {
    console.error("❌ Failed to setup audio mode:", error);
  }
}
