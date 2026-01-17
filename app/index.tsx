import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Header } from '../components/Header';
import { PreloadScreen } from '../components/PreloadScreen';
import { PTTButton } from '../components/PTTButton';
import { UserList } from '../components/UserList';
import { Colors } from '../constants/theme';
import { useIntercom } from '../hooks/useIntercom';

type AppState = 'preload' | 'setup' | 'intercom';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('preload');
  const [userName, setUserName] = useState('');
  const [churchCode, setChurchCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'director' | 'member'>('member');
  const [isJoining, setIsJoining] = useState(false);

  const {
    isConnected,
    isSpeaking,
    users,
    startTalking,
    stopTalking,
    joinRoom,
    leaveRoom,
    roomName,
    role
  } = useIntercom();

  const handleJoin = async () => {
    if (!userName || !churchCode) {
      Alert.alert("Missing Info", "Please enter your name and church code.");
      return;
    }

    setIsJoining(true);
    try {
      await joinRoom(churchCode, userName, selectedRole);
      setAppState('intercom');
    } catch (e: any) {
      Alert.alert("Join Error", "Could not connect to the MediaCom cloud. Check your internet.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleExit = () => {
    leaveRoom();
    setAppState('setup');
  };

  if (appState === 'preload') {
    return <PreloadScreen onFinish={() => setAppState('setup')} />;
  }

  if (appState === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.setupHeader}>
          <MaterialCommunityIcons name="broadcast" size={64} color={Colors.primary} />
          <Text style={styles.setupTitle}>MediaCom Cloud</Text>
          <Text style={styles.setupSubtitle}>Global coordination for your team.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Director, Sound Chief"
              placeholderTextColor={Colors.textDim}
              value={userName}
              onChangeText={setUserName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CHURCH CODE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GRACE-MEDIA (Create any name)"
              placeholderTextColor={Colors.textDim}
              value={churchCode}
              onChangeText={setChurchCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.rolePicker}>
            <TouchableOpacity
              style={[styles.roleBtn, selectedRole === 'director' && styles.roleBtnActive]}
              onPress={() => setSelectedRole('director')}
            >
              <Text style={[styles.roleBtnText, selectedRole === 'director' && styles.roleBtnTextActive]}>DIRECTOR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, selectedRole === 'member' && styles.roleBtnActive]}
              onPress={() => setSelectedRole('member')}
            >
              <Text style={[styles.roleBtnText, selectedRole === 'member' && styles.roleBtnTextActive]}>MEMBER</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isJoining && styles.disabledBtn]}
            onPress={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>ENTER CHANNEL</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Intercom State
  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.intercomInfo}>
        <View>
          <Text style={styles.intercomRoom}>{roomName.toUpperCase()}</Text>
          <Text style={styles.intercomRole}>{role.toUpperCase()} MODE</Text>
        </View>
        <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.danger} />
          <Text style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      <UserList users={users} />

      <View style={styles.bottomSection}>
        <PTTButton
          isSpeaking={isSpeaking}
          onPressIn={startTalking}
          onPressOut={stopTalking}
          disabled={!isConnected}
        />
        <Text style={styles.statusLabel}>
          {isConnected ? "🟢 ONLINE" : "🟠 CONNECTING..."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  setupHeader: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    marginTop: 16,
  },
  setupSubtitle: {
    fontSize: 14,
    color: Colors.textDim,
    marginTop: 4,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    color: Colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleBtnText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: '700',
  },
  roleBtnTextActive: {
    color: 'white',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  intercomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  intercomRoom: {
    color: Colors.primary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  intercomRole: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  exitText: {
    color: Colors.danger,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusLabel: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: 1,
  }
});
